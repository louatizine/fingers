Namespace VBNETSample
	Partial Class AboutForm
		''' <summary>
		''' Required designer variable.
		''' </summary>
		Private components As System.ComponentModel.IContainer = Nothing

		''' <summary>
		''' Clean up any resources being used.
		''' </summary>
		''' <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
		Protected Overloads Overrides Sub Dispose(ByVal disposing As Boolean)
			If disposing AndAlso (components IsNot Nothing) Then
				components.Dispose()
			End If
			MyBase.Dispose(disposing)
		End Sub

#Region "Windows Form Designer generated code"

		''' <summary>
		''' Required method for Designer support - do not modify
		''' the contents of this method with the code editor.
		''' </summary>
		Private Sub InitializeComponent()
			Me.pictureBox1 = New System.Windows.Forms.PictureBox
			Me.lblCopyright1 = New System.Windows.Forms.Label
			Me.lblCopyright2 = New System.Windows.Forms.Label
			Me.groupBox1 = New System.Windows.Forms.GroupBox
			Me.lblServicePack = New System.Windows.Forms.Label
			Me.lblOS = New System.Windows.Forms.Label
			Me.groupBox2 = New System.Windows.Forms.GroupBox
			Me.componentsListView = New System.Windows.Forms.ListView
			Me.componentColumnHeader = New System.Windows.Forms.ColumnHeader
			Me.versionColumnHeader = New System.Windows.Forms.ColumnHeader
			Me.copyrightColumnHeader = New System.Windows.Forms.ColumnHeader
			CType(Me.pictureBox1, System.ComponentModel.ISupportInitialize).BeginInit()
			Me.groupBox1.SuspendLayout()
			Me.groupBox2.SuspendLayout()
			Me.SuspendLayout()
			'
			'pictureBox1
			'
			Me.pictureBox1.BackColor = System.Drawing.SystemColors.Window
			Me.pictureBox1.Image = Global.VBNETSample.Resources.Neurotechnology
			Me.pictureBox1.Location = New System.Drawing.Point(12, 12)
			Me.pictureBox1.Name = "pictureBox1"
			Me.pictureBox1.Size = New System.Drawing.Size(230, 80)
			Me.pictureBox1.SizeMode = System.Windows.Forms.PictureBoxSizeMode.AutoSize
			Me.pictureBox1.TabIndex = 0
			Me.pictureBox1.TabStop = False
			'
			'lblCopyright1
			'
			Me.lblCopyright1.AutoSize = True
			Me.lblCopyright1.Location = New System.Drawing.Point(12, 105)
			Me.lblCopyright1.Name = "lblCopyright1"
			Me.lblCopyright1.Size = New System.Drawing.Size(92, 13)
			Me.lblCopyright1.TabIndex = 1
			Me.lblCopyright1.Text = "VeriFinger Sample"
			'
			'lblCopyright2
			'
			Me.lblCopyright2.AutoSize = True
			Me.lblCopyright2.Location = New System.Drawing.Point(12, 120)
			Me.lblCopyright2.Name = "lblCopyright2"
			Me.lblCopyright2.Size = New System.Drawing.Size(51, 13)
			Me.lblCopyright2.TabIndex = 2
			Me.lblCopyright2.Text = "Copyright"
			'
			'groupBox1
			'
			Me.groupBox1.Controls.Add(Me.lblServicePack)
			Me.groupBox1.Controls.Add(Me.lblOS)
			Me.groupBox1.Location = New System.Drawing.Point(12, 140)
			Me.groupBox1.Name = "groupBox1"
			Me.groupBox1.Size = New System.Drawing.Size(411, 60)
			Me.groupBox1.TabIndex = 3
			Me.groupBox1.TabStop = False
			Me.groupBox1.Text = "Operating system"
			'
			'lblServicePack
			'
			Me.lblServicePack.AutoSize = True
			Me.lblServicePack.Location = New System.Drawing.Point(6, 35)
			Me.lblServicePack.Name = "lblServicePack"
			Me.lblServicePack.Size = New System.Drawing.Size(21, 13)
			Me.lblServicePack.TabIndex = 5
			Me.lblServicePack.Text = "SP"
			'
			'lblOS
			'
			Me.lblOS.AutoSize = True
			Me.lblOS.Location = New System.Drawing.Point(6, 19)
			Me.lblOS.Name = "lblOS"
			Me.lblOS.Size = New System.Drawing.Size(22, 13)
			Me.lblOS.TabIndex = 4
			Me.lblOS.Text = "OS"
			'
			'groupBox2
			'
			Me.groupBox2.Controls.Add(Me.componentsListView)
			Me.groupBox2.Location = New System.Drawing.Point(12, 206)
			Me.groupBox2.Name = "groupBox2"
			Me.groupBox2.Size = New System.Drawing.Size(411, 206)
			Me.groupBox2.TabIndex = 4
			Me.groupBox2.TabStop = False
			Me.groupBox2.Text = "Components"
			'
			'componentsListView
			'
			Me.componentsListView.Columns.AddRange(New System.Windows.Forms.ColumnHeader() {Me.componentColumnHeader, Me.versionColumnHeader, Me.copyrightColumnHeader})
			Me.componentsListView.Dock = System.Windows.Forms.DockStyle.Fill
			Me.componentsListView.FullRowSelect = True
			Me.componentsListView.HeaderStyle = System.Windows.Forms.ColumnHeaderStyle.Nonclickable
			Me.componentsListView.Location = New System.Drawing.Point(3, 16)
			Me.componentsListView.Name = "componentsListView"
			Me.componentsListView.Size = New System.Drawing.Size(405, 187)
			Me.componentsListView.TabIndex = 16
			Me.componentsListView.UseCompatibleStateImageBehavior = False
			Me.componentsListView.View = System.Windows.Forms.View.Details
			'
			'componentColumnHeader
			'
			Me.componentColumnHeader.Text = "Component"
			Me.componentColumnHeader.Width = 300
			'
			'versionColumnHeader
			'
			Me.versionColumnHeader.Text = "Version"
			Me.versionColumnHeader.Width = 100
			'
			'copyrightColumnHeader
			'
			Me.copyrightColumnHeader.Text = "Copyright"
			Me.copyrightColumnHeader.Width = 200
			'
			'AboutForm
			'
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.BackColor = System.Drawing.SystemColors.Window
			Me.ClientSize = New System.Drawing.Size(435, 421)
			Me.Controls.Add(Me.groupBox2)
			Me.Controls.Add(Me.groupBox1)
			Me.Controls.Add(Me.lblCopyright2)
			Me.Controls.Add(Me.lblCopyright1)
			Me.Controls.Add(Me.pictureBox1)
			Me.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedToolWindow
			Me.MaximizeBox = False
			Me.MinimizeBox = False
			Me.Name = "AboutForm"
			Me.ShowInTaskbar = False
			Me.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen
			Me.Text = "About"
			CType(Me.pictureBox1, System.ComponentModel.ISupportInitialize).EndInit()
			Me.groupBox1.ResumeLayout(False)
			Me.groupBox1.PerformLayout()
			Me.groupBox2.ResumeLayout(False)
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

#End Region

		Private pictureBox1 As System.Windows.Forms.PictureBox
		Private lblCopyright1 As System.Windows.Forms.Label
		Private lblCopyright2 As System.Windows.Forms.Label
		Private groupBox1 As System.Windows.Forms.GroupBox
		Private lblServicePack As System.Windows.Forms.Label
		Private lblOS As System.Windows.Forms.Label
		Private groupBox2 As System.Windows.Forms.GroupBox
		Private componentsListView As System.Windows.Forms.ListView
		Private componentColumnHeader As System.Windows.Forms.ColumnHeader
		Private versionColumnHeader As System.Windows.Forms.ColumnHeader
		Private copyrightColumnHeader As System.Windows.Forms.ColumnHeader
	End Class
End Namespace

Namespace VBNETSample
	Partial Class MainForm
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
			Dim resources As System.ComponentModel.ComponentResourceManager = New System.ComponentModel.ComponentResourceManager(GetType(MainForm))
			Me.toolStrip1 = New System.Windows.Forms.ToolStrip
			Me.btnEnroll = New System.Windows.Forms.ToolStripButton
			Me.btnVerify = New System.Windows.Forms.ToolStripButton
			Me.toolStripSeparator2 = New System.Windows.Forms.ToolStripSeparator
			Me.btnDeleteUser = New System.Windows.Forms.ToolStripButton
			Me.btnClearDatabase = New System.Windows.Forms.ToolStripButton
			Me.toolStripSeparator1 = New System.Windows.Forms.ToolStripSeparator
			Me.btnSettings = New System.Windows.Forms.ToolStripButton
			Me.toolStripSeparator3 = New System.Windows.Forms.ToolStripSeparator
			Me.btnAbout = New System.Windows.Forms.ToolStripButton
			Me.splitContainer1 = New System.Windows.Forms.SplitContainer
			Me.pbExtractedImage = New System.Windows.Forms.PictureBox
			Me.tlpLeft = New System.Windows.Forms.TableLayoutPanel
			Me.lbDatabase = New System.Windows.Forms.ListBox
			Me.lblUserList = New System.Windows.Forms.Label
			Me.statusStrip1 = New System.Windows.Forms.StatusStrip
			Me.toolStrip1.SuspendLayout()
			Me.splitContainer1.Panel1.SuspendLayout()
			Me.splitContainer1.Panel2.SuspendLayout()
			Me.splitContainer1.SuspendLayout()
			CType(Me.pbExtractedImage, System.ComponentModel.ISupportInitialize).BeginInit()
			Me.tlpLeft.SuspendLayout()
			Me.SuspendLayout()
			'
			'toolStrip1
			'
			Me.toolStrip1.Items.AddRange(New System.Windows.Forms.ToolStripItem() {Me.btnEnroll, Me.btnVerify, Me.toolStripSeparator2, Me.btnDeleteUser, Me.btnClearDatabase, Me.toolStripSeparator1, Me.btnSettings, Me.toolStripSeparator3, Me.btnAbout})
			Me.toolStrip1.Location = New System.Drawing.Point(0, 0)
			Me.toolStrip1.Name = "toolStrip1"
			Me.toolStrip1.Size = New System.Drawing.Size(607, 25)
			Me.toolStrip1.TabIndex = 0
			Me.toolStrip1.Text = "toolStrip1"
			'
			'btnEnroll
			'
			Me.btnEnroll.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text
			Me.btnEnroll.Font = New System.Drawing.Font("Tahoma", 9.75!, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
			Me.btnEnroll.Image = CType(resources.GetObject("btnEnroll.Image"), System.Drawing.Image)
			Me.btnEnroll.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnEnroll.Name = "btnEnroll"
			Me.btnEnroll.Size = New System.Drawing.Size(47, 22)
			Me.btnEnroll.Text = "Enroll"
			'
			'btnVerify
			'
			Me.btnVerify.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text
			Me.btnVerify.Font = New System.Drawing.Font("Tahoma", 9.75!, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point, CType(0, Byte))
			Me.btnVerify.Image = CType(resources.GetObject("btnVerify.Image"), System.Drawing.Image)
			Me.btnVerify.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnVerify.Name = "btnVerify"
			Me.btnVerify.Size = New System.Drawing.Size(51, 22)
			Me.btnVerify.Text = "Verify"
			'
			'toolStripSeparator2
			'
			Me.toolStripSeparator2.Name = "toolStripSeparator2"
			Me.toolStripSeparator2.Size = New System.Drawing.Size(6, 25)
			'
			'btnDeleteUser
			'
			Me.btnDeleteUser.Image = Global.VBNETSample.Resources.Delete
			Me.btnDeleteUser.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnDeleteUser.Name = "btnDeleteUser"
			Me.btnDeleteUser.Size = New System.Drawing.Size(82, 22)
			Me.btnDeleteUser.Text = "Delete user"
			'
			'btnClearDatabase
			'
			Me.btnClearDatabase.Image = Global.VBNETSample.Resources.DeleteFolderHS
			Me.btnClearDatabase.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnClearDatabase.Name = "btnClearDatabase"
			Me.btnClearDatabase.Size = New System.Drawing.Size(101, 22)
			Me.btnClearDatabase.Text = "Clear Database"
			'
			'toolStripSeparator1
			'
			Me.toolStripSeparator1.Name = "toolStripSeparator1"
			Me.toolStripSeparator1.Size = New System.Drawing.Size(6, 25)
			'
			'btnSettings
			'
			Me.btnSettings.Image = Global.VBNETSample.Resources.OptionsHS
			Me.btnSettings.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnSettings.Name = "btnSettings"
			Me.btnSettings.Size = New System.Drawing.Size(66, 22)
			Me.btnSettings.Text = "Settings"
			'
			'toolStripSeparator3
			'
			Me.toolStripSeparator3.Name = "toolStripSeparator3"
			Me.toolStripSeparator3.Size = New System.Drawing.Size(6, 25)
			'
			'btnAbout
			'
			Me.btnAbout.Image = Global.VBNETSample.Resources.Info
			Me.btnAbout.ImageTransparentColor = System.Drawing.Color.Magenta
			Me.btnAbout.Name = "btnAbout"
			Me.btnAbout.Size = New System.Drawing.Size(56, 22)
			Me.btnAbout.Text = "About"
			'
			'splitContainer1
			'
			Me.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill
			Me.splitContainer1.Location = New System.Drawing.Point(0, 25)
			Me.splitContainer1.Name = "splitContainer1"
			'
			'splitContainer1.Panel1
			'
			Me.splitContainer1.Panel1.Controls.Add(Me.pbExtractedImage)
			'
			'splitContainer1.Panel2
			'
			Me.splitContainer1.Panel2.Controls.Add(Me.tlpLeft)
			Me.splitContainer1.Size = New System.Drawing.Size(607, 351)
			Me.splitContainer1.SplitterDistance = 440
			Me.splitContainer1.TabIndex = 1
			'
			'pbExtractedImage
			'
			Me.pbExtractedImage.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D
			Me.pbExtractedImage.Dock = System.Windows.Forms.DockStyle.Fill
			Me.pbExtractedImage.Location = New System.Drawing.Point(0, 0)
			Me.pbExtractedImage.Name = "pbExtractedImage"
			Me.pbExtractedImage.Size = New System.Drawing.Size(440, 351)
			Me.pbExtractedImage.SizeMode = System.Windows.Forms.PictureBoxSizeMode.CenterImage
			Me.pbExtractedImage.TabIndex = 0
			Me.pbExtractedImage.TabStop = False
			'
			'tlpLeft
			'
			Me.tlpLeft.ColumnCount = 1
			Me.tlpLeft.ColumnStyles.Add(New System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Percent, 100.0!))
			Me.tlpLeft.Controls.Add(Me.lbDatabase, 0, 1)
			Me.tlpLeft.Controls.Add(Me.lblUserList, 0, 0)
			Me.tlpLeft.Dock = System.Windows.Forms.DockStyle.Fill
			Me.tlpLeft.Location = New System.Drawing.Point(0, 0)
			Me.tlpLeft.Name = "tlpLeft"
			Me.tlpLeft.RowCount = 2
			Me.tlpLeft.RowStyles.Add(New System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 37.0!))
			Me.tlpLeft.RowStyles.Add(New System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Percent, 100.0!))
			Me.tlpLeft.Size = New System.Drawing.Size(163, 351)
			Me.tlpLeft.TabIndex = 0
			'
			'lbDatabase
			'
			Me.lbDatabase.Dock = System.Windows.Forms.DockStyle.Fill
			Me.lbDatabase.FormattingEnabled = True
			Me.lbDatabase.Location = New System.Drawing.Point(3, 40)
			Me.lbDatabase.Name = "lbDatabase"
			Me.lbDatabase.Size = New System.Drawing.Size(157, 303)
			Me.lbDatabase.TabIndex = 1
			'
			'lblUserList
			'
			Me.lblUserList.AutoSize = True
			Me.lblUserList.Dock = System.Windows.Forms.DockStyle.Fill
			Me.lblUserList.Location = New System.Drawing.Point(3, 0)
			Me.lblUserList.Name = "lblUserList"
			Me.lblUserList.Size = New System.Drawing.Size(157, 37)
			Me.lblUserList.TabIndex = 2
			Me.lblUserList.Text = "User list:"
			Me.lblUserList.TextAlign = System.Drawing.ContentAlignment.MiddleLeft
			'
			'statusStrip1
			'
			Me.statusStrip1.Location = New System.Drawing.Point(0, 376)
			Me.statusStrip1.Name = "statusStrip1"
			Me.statusStrip1.Size = New System.Drawing.Size(607, 22)
			Me.statusStrip1.TabIndex = 2
			Me.statusStrip1.Text = "statusStrip1"
			'
			'MainForm
			'
			Me.AutoScaleDimensions = New System.Drawing.SizeF(6.0!, 13.0!)
			Me.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font
			Me.ClientSize = New System.Drawing.Size(607, 398)
			Me.Controls.Add(Me.splitContainer1)
			Me.Controls.Add(Me.toolStrip1)
			Me.Controls.Add(Me.statusStrip1)
			Me.Icon = CType(resources.GetObject("$this.Icon"), System.Drawing.Icon)
			Me.Name = "MainForm"
			Me.Text = "Nffv VB .NET Sample"
			Me.toolStrip1.ResumeLayout(False)
			Me.toolStrip1.PerformLayout()
			Me.splitContainer1.Panel1.ResumeLayout(False)
			Me.splitContainer1.Panel2.ResumeLayout(False)
			Me.splitContainer1.ResumeLayout(False)
			CType(Me.pbExtractedImage, System.ComponentModel.ISupportInitialize).EndInit()
			Me.tlpLeft.ResumeLayout(False)
			Me.tlpLeft.PerformLayout()
			Me.ResumeLayout(False)
			Me.PerformLayout()

		End Sub

#End Region

		Private toolStrip1 As System.Windows.Forms.ToolStrip
		Private WithEvents btnEnroll As System.Windows.Forms.ToolStripButton
		Private WithEvents btnVerify As System.Windows.Forms.ToolStripButton
		Private splitContainer1 As System.Windows.Forms.SplitContainer
		Private pbExtractedImage As System.Windows.Forms.PictureBox
		Private statusStrip1 As System.Windows.Forms.StatusStrip
		Private toolStripSeparator1 As System.Windows.Forms.ToolStripSeparator
		Private WithEvents btnDeleteUser As System.Windows.Forms.ToolStripButton
		Private WithEvents btnSettings As System.Windows.Forms.ToolStripButton
		Private toolStripSeparator2 As System.Windows.Forms.ToolStripSeparator
		Private WithEvents btnClearDatabase As System.Windows.Forms.ToolStripButton
		Private toolStripSeparator3 As System.Windows.Forms.ToolStripSeparator
		Private WithEvents btnAbout As System.Windows.Forms.ToolStripButton
		Friend WithEvents tlpLeft As System.Windows.Forms.TableLayoutPanel
		Friend WithEvents lbDatabase As System.Windows.Forms.ListBox
		Friend WithEvents lblUserList As System.Windows.Forms.Label

	End Class
End Namespace

